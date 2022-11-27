const { wallet, sc, CONST } = require("@cityofzion/neon-js")
const { helpers } = require("@cityofzion/props")
const fs = require("fs")
require("dotenv").config()

var network, url, privateKey, signer, contractScript, networkMagic, toAddress
network = process.argv[2]

if (network.toLowerCase() == "testnet") {
    url = "https://testnet1.neo.coz.io:443/"
    privateKey = process.env.PRIVATE_KEY
    signer = new wallet.Account(privateKey)
    contractScript = "0x1488ce22ded38a0b3a2df68f6ea786589a687c71"
    networkMagic = 894710606
    toAddress = "NSKKL5EAftBwjnPTMZAvqWrMY6WjsCrTMo"
} else if (network.toLowerCase() == "localhost") {
    network = JSON.parse(fs.readFileSync("default.neo-express").toString())
    privateKey = network.wallets[0].accounts[0]["private-key"]
    url = "http://localhost:50012"
    signer = new wallet.Account(privateKey)
    contractScript = "0x1488ce22ded38a0b3a2df68f6ea786589a687c71"
    networkMagic = network["magic"]
    toAddress = "NRbPohE8irGEPnB8J9AgyPyZPCSCYUSRmv"
} else {
    console.log("network not detected!")
    process.exit(0)
}

const amount = 1000000000
const timeConstant = 16000
const params = [
    sc.ContractParam.hash160(signer.address),
    sc.ContractParam.hash160(toAddress),
    sc.ContractParam.integer(amount),
    sc.ContractParam.array(),
]

async function transfer(url, contractScript, signer, params) {
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
        console.log(e)
        process.exit(1)
    })
