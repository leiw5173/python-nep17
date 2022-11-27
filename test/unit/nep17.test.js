const sdk = require("@cityofzion/props")
const Neon = require("@cityofzion/neon-js")
const fs = require("fs")
const assert = require("assert")

describe("NEP17 Token Test", function () {
    const TIME_CONSTANT = 4000
    const AMOUNT = 1000000000
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
            const res = await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "symbol",
                []
            )
            assert(Neon.u.base642utf8(res[0].value) == "TEST", "Symbol return wrong")
        })
        it("the decimal should be 8", async function () {
            const res = await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "decimals",
                []
            )
            assert.equal(res[0].value, 8)
        })
        it("total supply should be 10_000_000*10**8", async function () {
            const res = await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "totalSupply",
                []
            )
            assert.equal(res[0].value, 10_000_000 * 10 ** 8, "total supply wrong")
        })
    })

    describe("transfer testing", function () {
        it("transfer works", async function () {
            const toAddressBalanceBefore = await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "balanceOf",
                [Neon.sc.ContractParam.hash160(TO_ADDRESS)]
            )
            const fromAddressBalanceBefore = await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "balanceOf",
                [Neon.sc.ContractParam.hash160(signer.address)]
            )
            await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "transfer",
                [
                    Neon.sc.ContractParam.hash160(signer.address),
                    Neon.sc.ContractParam.hash160(TO_ADDRESS),
                    Neon.sc.ContractParam.integer(AMOUNT),
                    Neon.sc.ContractParam.array(),
                ],
                signer
            )
            // await sdk.helpers.sleep(5000)
            const toAddressBalanceAfter = await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "balanceOf",
                [Neon.sc.ContractParam.hash160(TO_ADDRESS)]
            )
            const fromAddressBalanceAfter = await sdk.helpers.variableInvoke(
                URL,
                networkMagic,
                CONTRACT_HASH,
                "balanceOf",
                [Neon.sc.ContractParam.hash160(signer.address)]
            )
            assert.equal(
                toAddressBalanceAfter[0].value - toAddressBalanceBefore[0].value,
                fromAddressBalanceBefore[0].value - fromAddressBalanceAfter[0].value,
                "transfer function wrong"
            )
        })
    })
})
