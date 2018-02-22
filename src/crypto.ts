import * as _sodium from 'libsodium-wrappers'
import * as sodium from 'sodium';

/*
(async (): Promise<void> => {
  await _sodium.ready;
  const sodium = _sodium;

  let key: Uint8Array = sodium.crypto_secretstream_xchacha20poly1305_keygen();
  console.log("key is ", key)

  let res: Uint8Array = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
  console.log('res is ', res);

  let c1 = sodium.crypto_secretstream_xchacha20poly1305_push(
    res.state,
    sodium.from_string('message 1'),
    null,
    sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
    );
  console.log('c1 is ', c1)
  let c2 = sodium.crypto_secretstream_xchacha20poly1305_push(
    res.state,
    sodium.from_string('message 2'),
    null,
    sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
    );
  console.log('c2 is ', c2);

  let state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(res.header, key)
  console.log('state _in is ', state_in)

  let r1 = sodium.crypto_secretstream_xchacha20poly1305_pull(state_in, c1);
  let [m1, tag1] = [sodium.to_string(r1.message), r1.tag];
  let r2 = sodium.crypto_secretstream_xchacha20poly1305_pull(state_in, c2);
  let [m2, tag2] = [sodium.to_string(r2.message), r2.tag];
  console.log(m1)

})();
*/


(async () => {
  const api = sodium.api;
  console.log("api is ", api)
  let box = new sodium.Box();
  const cipherText: any = box.encrypt("This is a secret message", "utf8");
  console.log(cipherText)
  const plainText = box.decrypt(cipherText, 'utf8');
  console.log("plainText is ", plainText)
})();