import * as _sodium from 'libsodium-wrappers'


(async () => {
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

  let state_in = sodium.crypto

})()