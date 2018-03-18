import {HDNode} from "bitcoinjs-lib";
import {Identity} from "./primitives/identity";

export default interface KeyDB {

}

export class InMemoryDB extends Map<Identity, HDNode> implements KeyDB {
}