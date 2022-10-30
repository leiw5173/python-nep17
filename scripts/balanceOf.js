const { rpc, sc, u } = require("@cityofzion/neon-js");
const Neon = require("@cityofzion/neon-js");

const url = "https://testnet2.neo.coz.io:443";
const address = "NQ8uxEgW8S8AEMKSXXXVDoEHEX9a1xiowA";
const contractScript = "0x5fdb2552f6512f6ed60b6dc34c3c7fc5d756bef7";

const rpcClient = new rpc.RPCClient(url);

async function balanceOf(address) {
  const params = [sc.ContractParam.hash160(address)];
  const res = await rpcClient.invokeFunction(
    contractScript,
    "balanceOf",
    params
  );
  return res;
}

balanceOf(address)
  .then((r) => console.log(r))
  .catch((e) => console.log(e));
