#!/usr/bin/env bash
set -u

address=$(bitcoin-cli -regtest -rpcuser=foo -rpcpassword=bar -rpcport=18332 getnewaddress)
address2=$(bitcoin-cli -regtest -rpcuser=foo -rpcpassword=bar -rpcport=18332 getnewaddress)
bitcoin-cli -regtest -rpcuser=foo -rpcpassword=bar -rpcport=18332 generatetoaddress 1 $address
bitcoin-cli -regtest -rpcuser=foo -rpcpassword=bar -rpcport=18332 generatetoaddress 1 $address2
bitcoin-cli -regtest -rpcuser=foo -rpcpassword=bar -rpcport=18332 generate 100
