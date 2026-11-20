# Third-party software

The IPK contains these components. Runtime licence texts are in `runtime/licences/`.

| Part | Files | Licence | Source |
|---|---|---|---|
| sherpa-onnx 2.0.1 | `lib/libsherpa-onnx-c-api.so` | Apache-2.0 | [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) |
| ONNX Runtime 1.28.2, from the same release | `lib/libonnxruntime.so` | MIT | [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime) |
| Phonon 2.5 C engine and musl | `bin/lvengine-phonon-*` | MIT | [eschmidbauer/phonon-2.5-c](https://github.com/eschmidbauer/phonon-2.5-c), [Local Voice's decoder patch](native/phonon-decoder-weights.patch), [musl](https://musl.libc.org/) |
| GNU C Library 2.35 (`libc6` 2.35-0ubuntu3.8) and GCC 12.3.0 runtime libraries (`libgcc-s1`, `libstdc++6` 12.3.0-1ubuntu1~22.04), from Ubuntu 22.04.5 armhf | `lib/ld-linux-armhf.so.3`, `libc.so.6`, `libm.so.6`, `libdl.so.2`, `libpthread.so.0`, `librt.so.1`, `libgcc_s.so.1`, `libstdc++.so.6` | LGPL-2.1+ (glibc), GPL-3.0+ with the GCC Runtime Library Exception (GCC) | [Ubuntu base](https://cdimage.ubuntu.com/ubuntu-base/releases/22.04/release/); the matching source is attached to each [release](https://github.com/golololologol/webos-localvoice/releases) |
| AI-Orb by Nick Vyhouski, a plain-JavaScript build from the `local-voice` branch of [haywirephoenix/AI-Orb](https://github.com/haywirephoenix/AI-Orb/tree/local-voice) | `card/card.ipk`: `orb/ai-orb.js`, licence in `orb/LICENSE` | MIT | [weeeha/AI-Orb](https://github.com/weeeha/AI-Orb) |
| Noto Sans (Latin, variable weight), from `@fontsource-variable/noto-sans` 5.2.10 | `fonts/NotoSans-latin-wght.woff2`, licence in `fonts/OFL.txt` | SIL Open Font License 1.1 | [notofonts/latin-greek-cyrillic](https://github.com/notofonts/latin-greek-cyrillic) |

The TV downloads the speech models listed in `app/models.json` when requested.

- Moonshine (MIT, [moonshine-ai/moonshine](https://github.com/moonshine-ai/moonshine)), with its `LICENSE` beside it.
- Parakeet TDT 110M by NVIDIA (CC BY 4.0, [nvidia/parakeet-tdt_ctc-110m](https://huggingface.co/nvidia/parakeet-tdt_ctc-110m)), unchanged apart from sherpa-onnx's conversion and 8-bit quantization.
- Phonon 2.5 by Fermion Research (CC BY 4.0, [original weights and attribution](https://huggingface.co/FermionResearch/Phonon-2.5)), derived from NVIDIA Parakeet TDT 0.6B v3 and [repacked for the C engine](https://huggingface.co/eschmidbauer/phonon-2.5-c).

`runtime/bin/lvengine` is not third-party: it is built from `native/lvengine.c` in this repository, under its MIT licence, and links to the libraries above.

The C libraries are there because the sherpa-onnx build needs a newer glibc than the TV has. They are used only by the recogniser, through their own loader, and nothing in the TV's system folders changes.

The way the remote's microphone is opened, and the silence rules, follow [cleanyourtv-WebOS](https://github.com/lasharor/cleanyourtv-WebOS) (MIT). Taking a service's name with a stub follows [lifesgoodwithoutspying](https://github.com/lewisdoesstuff/lifesgoodwithoutspying).
