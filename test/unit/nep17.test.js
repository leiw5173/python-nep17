const sdk = require("@cityofzion/props")
const Neon = require("@cityofzion/neon-core")
const fs = require("fs")
const assert = require("assert")

describle("NEP17 Token Test", function(){
    const TIME_CONSTANT = 4000
    let nep, network

    beforeEach(async function (){
        const targetNetwork = sdk.types.NetworkOption.LocalNet

        nep = await new sdk.
    })
})