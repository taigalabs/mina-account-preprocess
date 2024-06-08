import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
} from 'o1js';

import { Lookup } from './Lookup';

let proofsEnabled = false;

const ATST_ADDR_1 = 'B62qoWPhkV7PJnU3jJjnecGe5AWzesv5Q1GYySsqbc85ShsWam5mckV';
const ATST_ADDR_2 = 'B62qqNj2cEFqKpVPKH26ToNBTthPqCdD6udNMA8eWM58H6XGxg1nqvp';
const ATST_ADDR_3 = 'B62qmTuWDkkVsdU5LivZ6Bv5R6M3fiNt5Y9hgDmYzwuQfUj318X6YwA';

let pk1 = PublicKey.fromBase58(ATST_ADDR_1);
let pk2 = PublicKey.fromBase58(ATST_ADDR_2);

describe('OracleExample', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Lookup;

  beforeAll(async () => {
    if (proofsEnabled) await Lookup.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    deployerAccount = Local.testAccounts[0];
    deployerKey = deployerAccount.key;
    senderAccount = Local.testAccounts[1];
    senderKey = senderAccount.key;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Lookup(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      let deployer = AccountUpdate.fundNewAccount(deployerAccount);

      // deployer.send({
      //   to: pk1,
      //   amount: 3,
      // });

      // let addr1 = PublicKey.fromBase58(ATST_ADDR_1);
      // let addr2 = PublicKey.fromBase58(ATST_ADDR_2);
      // let addr1Update = AccountUpdate.create(addr1);
      // let addr2Update = AccountUpdate.create(addr2);

      // addr1Update.send({
      //   to: addr2Update,
      //   amount: 100,
      // });

      await zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('test_1', async () => {
    await localDeploy();

    const response = await fetch(
      'https://07-oracles.vercel.app/api/credit-score?user=1'
    );
    const data = await response.json();

    console.log('data', data);

    const id = Field(data.data.id);
    const creditScore = Field(data.data.creditScore);
    const signature = Signature.fromBase58(data.signature);

    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.verify(id, creditScore, signature);
    });
    await txn.prove();
    const signed = txn.sign([senderKey]);
    console.log('signed', signed);

    await signed.send();

    // const events = await zkApp.fetchEvents();
    // const verifiedEventValue = events[0].event.data.toFields(null)[0];
    // expect(verifiedEventValue).toEqual(id);

    // console.log('account update', addr2Update);
    let addr1Update = AccountUpdate.create(pk1);
    let addr2Update = AccountUpdate.create(deployerAccount);

    let bal1 = addr1Update.account.balance.get();
    let bal2 = addr2Update.account.balance.get();

    console.log('bal1', bal1);
    console.log('bal2', bal2);
  });
});
