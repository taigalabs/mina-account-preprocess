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

// The public key of our trusted data provider
const ORACLE_PUBLIC_KEY =
  'B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy';

const KNOWN_ADDR_1 = 'B62qkbCH6jLfVEgR36UGyUzzFTPogr2CQb8fPLLFr6DWajMokYEAJvX';

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
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('power', async () => {
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

    const events = await zkApp.fetchEvents();
    const verifiedEventValue = events[0].event.data.toFields(null)[0];
    expect(verifiedEventValue).toEqual(id);

    let addr = PublicKey.fromBase58(KNOWN_ADDR_1);
    let accountUpdate = AccountUpdate.create(addr);

    console.log('account update', accountUpdate);

    // use the balance of this account
    let balance = accountUpdate.account.balance.get();

    console.log('balance', balance);
    // accountUpdate.account.balance.assertEquals(balance);
  });
});
