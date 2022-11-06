from typing import Any, Union

from boa3.builtin import public, metadata, NeoMetadata
from boa3.builtin.type import UInt160
from boa3.builtin.contract import Nep17TransferEvent, abort
from boa3.builtin.interop import storage
from boa3.builtin.interop.runtime import calling_script_hash, check_witness
from boa3.builtin.interop.contract import call_contract, GAS as GAS_SCRIPT, NEO as NEO_SCRIPT
from boa3.builtin.nativecontract.contractmanagement import ContractManagement

# --------------------------
# CONSTANTS
# --------------------------

# Script hash of the contract owner
OWNER = UInt160("NXi7noenBkiqJu4zjckontBPyM4btJ275U".to_script_hash())

# Symbol of the Token
TOKEN_SYMBOL = "TEST"
SUPPLY_KEY = 'totalSupply'

# Number of decimal places
TOKEN_DECIMAL = 8

# Total supply of tokens in the system
TOKEN_TOTAL_SUPPLY = 10_000_000*10**TOKEN_DECIMAL

# Value of this NEP-17 token corresponds to NEO
AMOUNT_PER_NEO = 10

# Value of this NEP017 token corresponds to GAS
AMOUNT_PER_GAS = 2

# --------------------------
# EVENTS
# --------------------------

on_transfer = Nep17TransferEvent

# --------------------------
# NEP-17 Methods
# --------------------------

@public(safe=True)
def symbol() -> str:
    """
    Gets the symbols of the token.

    This string must be valid ASCII, must not contain whitespace or control characters, should be limited to uppercase
    Latin alphabet (i.e. the 26 letters used in English) and should be short (3-8 characters is recommended).
    This method must always return the same value every time it is invoked.

    :return: a short string representing symbol of the token managed in this contract.
    """
    return TOKEN_SYMBOL

@public(safe=True)
def decimals()-> int:
    """
    Gets the amount of decimals used by the token.

    E.g. 8, means to divide the token amount by 100,000,000 (10 ^ 8) to get its user representation.
    This method must always return the same value every time it is invoked.

    :return: the number of decimals used by the token.
    """
    return TOKEN_DECIMAL

@public(name='totalSupply',safe=True)
def totalSupply() -> int:
    """
    Gets the total token supply deployed in the system.

    This number must not be in its user representation. E.g. if the total supply is 10,000,000 tokens, this method
    must return 10,000,000 * 10 ^ decimals.
    
    :return: the total token supply deployed in the system.
    """
    return storage.get(SUPPLY_KEY).to_int()

@public(name='balanceOf',safe=True)
def balanceOf(account: UInt160) -> int:
    """
    Get the current balance of an address

    The parameter account must be a 20-byte address represented by a UInt160.

    :param account: the account address to retrieve the balance for
    :type account: UInt160
    """
    assert len(account) == 20, 'invalid address'

    return storage.get(account).to_int()

@public
def transfer(from_address: UInt160, to_address: UInt160, amount: int, data: Any) -> bool:
    """
    Transfers an amount of NEP17 tokens from one account to another

    If the method succeeds, it must fire the `Transfer` event and must return true, even if the amount is 0,
    or from and to are the same address.

    :param from_address: the address to transfer from
    :type from_address: UInt160
    :param to_address: the address to transfer to
    :type to_address: UInt160
    :param amount: the amount of NEP17 tokens to transfer
    :type amount: int
    :param data: whatever data is pertinent to the onPayment method
    :type data: Any

    :return: whether the transfer was successful
    :raise AssertionError: raised if `from_address` or `to_address` length is not 20 or if `amount` is less than zero.
    """
    # the parameters from and to should be 20-byte addresses. If not, this method should throw an exception.
    assert len(from_address) == 20 and len(to_address) == 20, 'invalid address'
    # the parameters amount must be greater than or equal to 0. If not, this method should throw an exception.
    assert amount >= 0, 'invalid amount'

    # The function MUST return false if the from account balance does not have enough tokens to spend.
    from_balance = storage.get(from_address).to_int()
    if from_balance < amount:
        return False

    # The function should check whether the from address equals the caller contract hash.
    # If so, the transfer should be processed;
    # If not, the function should use the check_witness to verify the transfer.
    if from_address != calling_script_hash:
        if not check_witness(from_address):
            return False

    # Skip balance changes if transferring to yourself or transferring 0 cryptocurrency.
    if from_address != to_address and amount != 0:
        if from_balance == amount:
            storage.delete(from_address)
        else:
            storage.put(from_address, from_balance - amount)

        to_balance = storage.get(to_address).to_int()
        storage.put(to_address, to_balance + amount)

    # if the method succeeds, it must fire the transfer event
    on_transfer(from_address, to_address, amount)
    # if the to_address is a smart contract, it must call the contracts onPayment.
    post_transfer(from_address, to_address, amount, data)
    # and then it must return true
    return True

def post_transfer(from_address: Union[UInt160, None], to_address: Union[UInt160, None], amount: int, data: Any):
    """
    Checks if the one receiving NEP17 tokens is a smart contract and if it's one the onPayment method will be called

    :param from_address: the address of the sender
    :type from_address: UInt160
    :param to_address: the address of the receiver
    :type to_address: UInt160
    :param amount: the amount of cryptocurrency that is being sent
    :type amount: int
    :param data: any pertinent data that might validate the transaction
    :type data: Any
    """
    if to_address is not None:
        contract = ContractManagement.get_contract(to_address)
        if contract is not None:
            call_contract(to_address, 'onNEP17Payment', [from_address, amount, data])

def mint(account: UInt160, amount: int):
    """
    Mints new tokens. This is not a NEP-17 standard method, it's only being use to complement the onPayment method
    
    :param account: the address of the account that is sending cryptocurrency to this contract
    :type account: UInt160
    :param amount: the amount of gas to be refunded
    :type amount: int
    :raise AssertionError: raised if amount is less than than 0
    """
    assert amount >= 0, 'invalid amount!'
    if amount != 0:
        current_total_supply = totalSupply()
        account_balance = balanceOf(account)

        storage.put(SUPPLY_KEY, current_total_supply + amount)
        storage.put(account, account_balance + amount)

        on_transfer(None, account, amount)
        post_transfer(None, account, amount, None)

@public
def verify() -> bool:
    """
    When this contract address is included in the transaction signature,
    this method will be triggered as a VerificationTrigger to verify that the signature is correct.
    For example, this method needs to be called when withdrawing token from the contract.

    :return: whether the transaction signature is correct
    """
    return check_witness(OWNER)

# --------------------------
# Other Methods
# --------------------------

@public
def _deploy(data: Any, update: bool):
    """
    Initializes the storage when the smart contract is deployed.

    :return: whether the deploy was successful. This method must return True only during the smart contract's deploy.
    """
    if update:
        return
    
    if storage.get(SUPPLY_KEY).to_int()>0:
        return

    storage.put(SUPPLY_KEY, TOKEN_TOTAL_SUPPLY)
    storage.put(OWNER, TOKEN_TOTAL_SUPPLY)

    on_transfer(None, OWNER, TOKEN_TOTAL_SUPPLY)

@public
def onNEP17Payment(from_address: UInt160, amount: int, data: Any):
    """
    NEP-17 affirms :"if the receiver is a deployed contract, the function MUST call onPayment method on receiver
    contract with the data parameter from transfer AFTER firing the Transfer event. If the receiver doesn't want to
    receive this transfer it MUST call ABORT." Therefore, since this is a smart contract, onPayment must exists.

    There is no guideline as to how it should verify the transaction and it's up to the user to make this verification.

    For instance, this onPayment method checks if this smart contract is receiving NEO or GAS so that it can mint a
    NEP17 token. If it's not receiving a native token, than it will abort.

    :param from_address: the address of the one who is trying to send cryptocurrency to this smart contract
    :type from_address: UInt160
    :param amount: the amount of cryptocurrency that is being sent to the this smart contract
    :type amount: int
    :param data: any pertinent data that might validate the transaction
    :type data: Any
    """
    if calling_script_hash == NEO_SCRIPT:
        corresponding_amount = amount * AMOUNT_PER_NEO
        mint(from_address, corresponding_amount)
    elif calling_script_hash == GAS_SCRIPT:
        corresponding_amount = amount * AMOUNT_PER_GAS
        mint(from_address, corresponding_amount)
    else:
        abort()

# --------------------------
# Manifest method with Contract's metadata
# --------------------------
@metadata
def manifest_metadata() -> NeoMetadata:
    """
    Defines this smart contract's metadata information
    """
    meta = NeoMetadata()
    meta.supported_standards = ['NEP-17']
    meta.add_permission(methods=['onNEP17Payment'])
    
    meta.author = "Secret"
    meta.description = "practice"
    meta.email = "404@neo.org"
    # meta.version = "0.0.1"
    # meta.extras = {
    #     'Date of Creation': '10/2/2022'
    # }
    return meta