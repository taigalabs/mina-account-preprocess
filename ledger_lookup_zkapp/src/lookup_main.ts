import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
} from 'o1js';

import { Lookup } from './lookup';

let proofsEnabled = false;

const atstAddrs = [
  'B62qoUVTKseKucekfhegBxuaMkoJ37ThTE12gpGWjExV4UZvhqZD6w9',
  'B62qkCJWFegi3Btq8FGHB29HMJBLC93T2Aurf4nzq5d46t69MAt5RSv',
  'B62qnLst6xuPFhPE2RyQFCcDUXS75A8UhiNXqCMNVfavWSXRsKFuj9c',
];

const MINA_EXPLORER_ENDPOINT = 'https://api.minaexplorer.com';

// let pk1 = PublicKey.fromBase58(ATST_ADDR_1);
// let pk2 = PublicKey.fromBase58(ATST_ADDR_2);
//
function getAccDetail(pk: string) {
  const url = `${MINA_EXPLORER_ENDPOINT}/accounts/${pk}`;

  return fetch(url);
}

(async () => {
  if (proofsEnabled) await Lookup.compile();
  const Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);

  let deployerAccount = Local.testAccounts[0];
  let deployerKey = deployerAccount.key;
  let senderAccount = Local.testAccounts[1];
  let senderKey = senderAccount.key;
  let zkAppPrivateKey = PrivateKey.random();
  let zkAppAddress = zkAppPrivateKey.toPublicKey();
  let zkApp = new Lookup(zkAppAddress);

  for (const addr of atstAddrs) {
    console.log(11, addr);
    const acc = await getAccDetail(addr);
    const json = await acc.json();
    const total = json.account?.balance.total;
    console.log(1, total);
  }

  // const deployTx = await Mina.transaction(deployerAccount, async () => {
  //   let deployer = AccountUpdate.fundNewAccount(deployerAccount);
  //   // deployer.send({
  //   //   to: pk1,
  //   //   amount: 3,
  //   // });
  //   // let addr1 = PublicKey.fromBase58(ATST_ADDR_1);
  //   // let addr2 = PublicKey.fromBase58(ATST_ADDR_2);
  //   // let addr1Update = AccountUpdate.create(addr1);
  //   // let addr2Update = AccountUpdate.create(addr2);
  //   // addr1Update.send({
  //   //   to: addr2Update,
  //   //   amount: 100,
  //   // });
  //   await zkApp.deploy();
  // });
  // await deployTx.prove();
  // // // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
  // await deployTx.sign([deployerKey, zkAppPrivateKey]).send();

  // const url = `${ATST_ADD}`;

  // const response = await fetch(
  //   'https://07-oracles.vercel.app/api/credit-score?user=1'
  // );
  // const data = await response.json();
  // console.log('data', data);

  // const id = Field(data.data.id);
  // const creditScore = Field(data.data.creditScore);
  // const signature = Signature.fromBase58(data.signature);
  const txn = await Mina.transaction(deployerAccount, async () => {
    // await zkApp.lookup();
  });
  // await txn.prove();
  // const signed = txn.sign([senderKey]);
  // console.log('signed', signed);
  // await signed.send();
  // // const events = await zkApp.fetchEvents();
  // // const verifiedEventValue = events[0].event.data.toFields(null)[0];
  // // expect(verifiedEventValue).toEqual(id);
  // // console.log('account update', addr2Update);
  // let addr1Update = AccountUpdate.create(pk1);
  // let addr2Update = AccountUpdate.create(deployerAccount);
  // let bal1 = addr1Update.account.balance.get();
  // let bal2 = addr2Update.account.balance.get();
  // console.log('bal1', bal1);
  // console.log('bal2', bal2);
})();
