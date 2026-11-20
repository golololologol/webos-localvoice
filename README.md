# Local Voice

Speech recognition that runs on a rooted LG webOS TV. The remote's microphone button, and apps with their own such as YouTube, get their text from a model on the TV instead of LG's cloud service, with no changes to the apps. Audio is never saved or sent anywhere.

This fork adds support for newer Magic Remote audio services, faster microphone startup, and the multilingual Phonon 2.5 model. It is based on [the original Local Voice](https://github.com/haywirephoenix/webos-localvoice), which was developed on an LG BX with webOS 5.4. The microphone updates were tested on LG C3 and C4 TVs.

- Hold the remote's microphone button and speak: the words go into the selected text box, Kodi's keyboard, or a YouTube search.
- Apps with their own microphone button get the words as their speech result.
- A card shows a live voice level, then what was heard, without taking focus from the app beneath.
- Speech models are downloaded in the app, from a fixed list, each checked against a pinned checksum.
- Nothing about what you say or do is logged unless you turn on the debug log.
- Nothing is sent anywhere unless you press **Send** on the Compatibility card. A report holds the TV's model, webOS and firmware versions, the app version and your yes or no answers.

## Install

Needs root and the Homebrew Channel.

1. Download the IPK from [this fork's releases](https://github.com/golololologol/webos-localvoice/releases) and install it on the TV with `ares-install -d <tv> <file.ipk>`. The fork uses the original app ID and reads the existing settings and downloaded models.
2. Open **Local Voice**, choose **Turn on**, then download a model in **Speech models**. Parakeet TDT 110M is recommended for English.

After an update, turn Local Voice off and on again. With lifesgoodwithoutspying's **Voice** switch on, enable the Local Voice entries in its **Exceptions** tab and apply. TVs with a separate `voiceinput_hidraw` service also need a build that offers the [Magic Remote HID audio capture exception](https://github.com/lewisdoesstuff/lifesgoodwithoutspying/pull/72). See the upstream [installation notes](https://github.com/haywirephoenix/webos-localvoice/wiki/Installing).

## Speech models

[Phonon 2.5](https://huggingface.co/FermionResearch/Phonon-2.5) recognizes 25 European languages, including English, Russian and Ukrainian. Accuracy can drop when you switch languages within a phrase. The TV downloads the [converted C weights](https://huggingface.co/eschmidbauer/phonon-2.5-c) separately. They take 183 MB to download and 244 MiB on disk.

Phonon uses the faster int8 path on 64-bit ARM CPUs with dot-product instructions and a float32 path on other 64-bit ARM CPUs and ARMv7 CPUs with NEON and VFPv4. It needs about 600 MiB of available memory to start, including headroom for the TV. Moonshine tiny-en is the smallest model. Open a model's language badge with the Magic Remote or hover over it to see the supported languages.

## YouTube AdFree

The optional [YouTube AdFree 0.9.2 patch](tools/youtube-adfree-localvoice.js) lets voice searches open inside a running YouTube page. Turn on **Toasts** in Local Voice to see search feedback.

Copy the AdFree app's `webOSUserScripts/userScript.js` off the TV and keep that copy as a backup. Run `node tools/youtube-adfree-localvoice.js userScript.js userScript.patched.js` on your computer. Replace the installed AdFree copy with `userScript.patched.js` under the original name, then reopen YouTube. Repeat after an AdFree reinstall if it restores the script. The tool checks the original script's checksum before it makes a patched copy.

## Documentation

The [wiki](https://github.com/haywirephoenix/webos-localvoice/wiki) covers [using Local Voice](https://github.com/haywirephoenix/webos-localvoice/wiki/Using-Local-Voice), [speech models](https://github.com/haywirephoenix/webos-localvoice/wiki/Speech-models), [privacy and logging](https://github.com/haywirephoenix/webos-localvoice/wiki/Privacy-and-logging), [troubleshooting](https://github.com/haywirephoenix/webos-localvoice/wiki/Troubleshooting), [how it works](https://github.com/haywirephoenix/webos-localvoice/wiki/How-it-works), and [building it or using it from another app](https://github.com/haywirephoenix/webos-localvoice/wiki/For-developers).

## Build

```sh
pip install ziglang
python tools/build.py
```

Install the `patch` command before building. Pass `--no-phonon` to build an IPK with just the original speech engine.

Run the tests with `node tests/detector.test.js`, `node tests/ctl.test.js`, `node tests/models.test.js`, `node tests/voiceinput.test.js` and `python tests/compat.test.py`.

The optional **Compatibility** form sends reports to the original project's [webos-compat](https://github.com/haywirephoenix/webos-compat) relay.

## Licence

MIT, see [LICENSE](LICENSE). The package includes third-party libraries, listed in [THIRD-PARTY.md](THIRD-PARTY.md). Speech models are downloaded separately.

## Thanks

The voice orb is based on the work of [AI-Orb](https://github.com/weeeha/AI-Orb) by Nick Vyhouski (weeeha), under the MIT licence, with many changes for Local Voice: one finish with an adjustable ring, a look for each state that reacts to how loud you are, error and no-input states, a see-through body, a grow and shrink animation, and a plain-JavaScript build that runs on webOS 5. The changes are on the [`local-voice` branch](https://github.com/haywirephoenix/AI-Orb/tree/local-voice) of a fork.

Speech recognition runs on [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx), with [Parakeet](https://huggingface.co/nvidia/parakeet-tdt_ctc-110m) by NVIDIA and [Moonshine](https://github.com/moonshine-ai/moonshine) by Moonshine AI.
