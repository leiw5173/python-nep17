const Neon = require("@cityofzion/neon-core")
const { helpers } = require("@cityofzion/props")
const fs = require("fs")
require("dotenv").config()

// const NETWORK =
const basePath = process.argv[2] || "contracts"
const NODE = process.argv[3] || "https://testnet1.neo.coz.io:443/"
const PRIVATE_KEY = process.argv[4] || process.env.PRIVATE_KEY
const SIGNER = new Neon.wallet.Account(PRIVATE_KEY)
const TIME_CONSTANT = process.argv[5] || 16000

async function NEFHunter(dirPath) {
    const files = fs.readdirSync(dirPath)

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            NEFHunter(dirPath + "/" + file)
        } else {
            const name = file.split(".").pop()
            if (file.split(".").pop() == "nef") {
                synchronousDeploy(NODE, dirPath + "/" + file, SIGNER, TIME_CONSTANT)
                // .then(() => process.exit(0))
                // .catch((erorr) => {
                //     console.log(erorr)
                //     process.exit(1)
                // })
            } else {
                console.log("nef file not found")
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
