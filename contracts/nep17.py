from typing import Any
from boa3.builtin import public, metadata, NeoMetadata
from boa3.builtin.type import UInt160
from boa3.builtin.contract import Nep17TransferEvent, abort
from boa3.builtin.interop import storage
from boa3.builtin.interop.runtime import calling_script_hash, check_witness
from boa3.builtin.interop.contract import call_contract
from boa3.builtin.interop.blockchain import get_contract

# --------------------------
# CONSTANTS
# --------------------------

OWNER = UInt160("NSKKL5EAftBwjnPTMZAvqWrMY6WjsCrTMo".to_script_hash())
TOKEN_SYMBOL = "NEW"
SUPPLY_KEY = 'totalSupply'
TOKEN_DECIMAL = 8
TOKEN_TOTAL_SUPPLY = 10_000_000*10**TOKEN_DECIMAL

# --------------------------
# EVENTS
# --------------------------

on_transfer = Nep17TransferEvent

# --------------------------
# NEP-17 Methods
# --------------------------

@public
def symbol() -> str:
    return TOKEN_SYMBOL

@public
def decimals()-> int:
    return TOKEN_DECIMAL

@public
def totalSupply() -> int:
    return storage.get(SUPPLY_KEY).to_int()

@public
def balanceOf(account: UInt160) -> int:
    assert len(account) == 20, 'invalid address'

    return storage.get(account).to_int()

@public
def transfer(from_address: UInt160, to_address: UInt160, amount: int, data: Any) -> bool:
    assert len(from_address) == 20 and len(to_address) == 20, 'invalid address'
    assert amount >= 0, 'invalid amount'

    from_balance = storage.get(from_address).to_int()
    if from_balance < amount:
        return False

    if from_address != calling_script_hash:
        if not check_witness(from_address):
            return False

    if from_address != to_address and amount != 0:
        if from_balance == amount:
            storage.delete(from_address)
        else:
            storage.put(from_address, from_balance - amount)

        to_balance = storage.get(to_address).to_int()
        storage.put(to_address, to_balance + amount)

    on_transfer(from_address, to_address, amount)

    contract = get_contract(to_address)
    if not isinstance(contract, None):
        call_contract(to_address, 'onNEP17Payment', [from_address, amount, data])

    return True

# --------------------------
# Other Methods
# --------------------------

@public
def _deploy(data: Any, update: bool):
    if update:
        return
    
    if storage.get(SUPPLY_KEY).to_int()>0:
        return

    storage.put(SUPPLY_KEY, TOKEN_TOTAL_SUPPLY)
    storage.put(OWNER, TOKEN_TOTAL_SUPPLY)

    on_transfer(None, OWNER, TOKEN_TOTAL_SUPPLY)

@public
def onNEP17Payment(from_address: UInt160, amount: int, data: Any):
    abort()

# --------------------------
# Manifest method with Contract's metadata
# --------------------------
@metadata
def manifest_metadata() -> NeoMetadata:
    meta = NeoMetadata()
    meta.author = "Secret"
    meta.description = "practice"
    meta.email = "404@neo.org"
    meta.version = "0.0.1"
    meta.extras = {
        'Date of Creation': '10/2/2022'
    }
    return meta