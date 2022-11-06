const { wallet, CONST, sc } = require("@cityofzion/neon-js")
const { api, helpers } = require("@cityofzion/props")
require("dotenv").config()

const url = "http://seed2t5.neo.org:20332/"
const contractScript = "0x5fdb2552f6512f6ed60b6dc34c3c7fc5d756bef7"
const toAddress = "NQ8uxEgW8S8AEMKSXXXVDoEHEX9a1xiowA"
const PRIVATE_KEY = process.env.PRIVATE_KEY
const signer = new wallet.Account(PRIVATE_KEY)
const amount = 10000
const timeConstant = 16000
const params = [
    sc.ContractParam.hash160(signer.address),
    sc.ContractParam.hash160(toAddress),
    amount,
    // [],
]

async function transfer(url, contractScript, signer, params) {
    const networkMagic = CONST.MAGIC_NUMBER.TestNet
    console.log("Transfering...")
    const txid = await helpers.variableInvoke(
        url,
        networkMagic,
        contractScript,
        "transfer",
        params,
        signer
    )
    await helpers.sleep(timeConstant)
    await helpers.txDidComplete(url, txid, true)
}

transfer(url, contractScript, signer, params)
    .then(() => process.exit(0))
    .catch((e) => {
        process.exit(1)
        console.log(e)
    })
