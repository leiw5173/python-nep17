const Neon = require("@cityofzion/neon-core")
const { helpers } = require("@cityofzion/props")
const fs = require("fs")
require("dotenv").config()

var network, node, privateKey, signer, timeConstant
network = process.argv[2]

if (network.toLowerCase() == "testnet") {
    node = "https://testnet1.neo.coz.io:443/"
    privateKey = process.env.PRIVATE_KEY
    signer = new Neon.wallet.Account(privateKey)
    timeConstant = 16000
} else if (network.toLowerCase() == "localhost") {
    network = JSON.parse(fs.readFileSync("default.neo-express").toString())
    privateKey = network.wallets[0].accounts[0]["private-key"]
    node = "http://localhost:50012"
    signer = new Neon.wallet.Account(privateKey)
    timeConstant = 16000
} else {
    console.log("network not detected!")
    process.exit(0)
}
const basePath = "contracts"

async function NEFHunter(dirPath) {
    const files = fs.readdirSync(dirPath)

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            NEFHunter(dirPath + "/" + file)
        } else {
            if (file.split(".").pop() == "nef") {
                synchronousDeploy(node, dirPath + "/" + file, signer, timeConstant)
            }
        }
    })
}

async function synchronousDeploy(node, pathToNEF, signer, timeConstant) {
    const rpcNode = new Neon.rpc.RPCClient(node)
    const getVersionRes = await rpcNode.getVersion()
    const networkMagic = getVersionRes.protocol.network

    const txid = await helpers.deployContract(node, networkMagic, pathToNEF, signer)
    await helpers.sleep(timeConstant)
    await helpers.txDidComplete(node, txid, true)
}

NEFHunter(basePath)
