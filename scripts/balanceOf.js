const { CONST, sc, u } = require("@cityofzion/neon-js")
const Neon = require("@cityofzion/neon-js")
const { helpers } = require("@cityofzion/props")

const url = "https://testnet2.neo.coz.io:443"
const address = "NQ8uxEgW8S8AEMKSXXXVDoEHEX9a1xiowA"
const contractScript = "0x5fdb2552f6512f6ed60b6dc34c3c7fc5d756bef7"
const networkMagic = CONST.MAGIC_NUMBER.TestNet

async function balanceOf(address) {
    const params = [sc.ContractParam.hash160(address)]
    const res = await helpers.variableInvoke(
        url,
        networkMagic,
        contractScript,
        "balanceOf",
        params
    )
    return res
}

async function symbol() {
    const networkMagic = Neon.CONST.MAGIC_NUMBER.TestNet
    const res = await helpers.variableInvoke(url, networkMagic, contractScript, "symbol", [])
    return res
}

balanceOf(address)
    .then((r) => console.log(r[0].value))
    .catch((e) => console.log(e))

symbol()
    .then((r) => console.log(u.base642utf8(r[0].value)))
    .catch((e) => console.log(e))
