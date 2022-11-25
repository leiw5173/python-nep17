const sdk = require("@cityofzion/props")
const Neon = require("@cityofzion/neon-core")
const fs = require("fs")
const assert = require("assert")

describe("NEP17 Token Test", function () {
    const TIME_CONSTANT = 4000
    const AMOUNT = 1000
    const URL = "http://127.0.0.1:50012"
    const TO_ADDRESS = "NR8isKNEYB92CxmxzD6GEH3ZgkCnKpY7fg"
    const CONTRACT_HASH = "0x1488ce22ded38a0b3a2df68f6ea786589a687c71"
    let network, networkMagic, privateKey, signer

    beforeEach(async function () {
        network = JSON.parse(fs.readFileSync("default.neo-express").toString())
        privateKey = network.wallets[0].accounts[0]["private-key"]
        signer = new Neon.wallet.Account(privateKey)
        networkMagic = network["magic"]
    })

    describe("Get right initial set up", function () {
        it("the symbol should be TEST", async function () {
            const txid = await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "symbol",
                []
            )
            const res = await sdk.helpers.txDidComplete(URL, txid, true)
            assert(Neon.u.base642utf8(res[0].value) == "TEST", "Symbol return wrong")
        })
    })
})
