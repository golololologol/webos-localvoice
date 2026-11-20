/* The lvengine pipe protocol, backed by the Phonon 2.5 C library. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "phonon25.h"

#if defined(__linux__)
#include <asm/hwcap.h>
#include <sys/auxv.h>
#endif

#define RATE 16000
#define MAX_SAMPLES (RATE * 30)

static int supported(void) {
#if defined(__ARM_FEATURE_DOTPROD) && defined(__aarch64__)
  return (getauxval(AT_HWCAP) & HWCAP_ASIMDDP) != 0;
#elif defined(__arm__)
  unsigned long features = getauxval(AT_HWCAP);
  return (features & (HWCAP_NEON | HWCAP_VFPv4)) == (HWCAP_NEON | HWCAP_VFPv4);
#else
  return 1;
#endif
}

static int run(P25Engine *engine) {
  static int16_t pcm[MAX_SAMPLES];
  static float samples[MAX_SAMPLES];
  int32_t count;

  puts("READY");
  fflush(stdout);
  while (fread(&count, sizeof count, 1, stdin) == 1) {
    if (count < 0 || count > MAX_SAMPLES) return 1;
    if (fread(pcm, sizeof *pcm, (size_t)count, stdin) != (size_t)count) break;
    for (int32_t i = 0; i < count; i++) samples[i] = pcm[i] / 32768.0f;

    P25Result result = {0};
    if (count && p25_transcribe(engine, samples, count, RATE, &result) != 0) {
      p25_result_free(&result);
      fputs("lvengine-phonon: could not transcribe\n", stderr);
      return 1;
    }
    fputs("TEXT ", stdout);
    for (const char *c = result.text; c && *c; c++) putchar(*c == '\n' || *c == '\r' ? ' ' : *c);
    putchar('\n');
    fflush(stdout);
    p25_result_free(&result);
  }
  return ferror(stdin) ? 1 : 0;
}

int main(int argc, char **argv) {
  if (!supported() || argc != 2) return 2;
  if (strcmp(argv[1], "--probe") == 0) return 0;

  setenv("P25_THREADS", "4", 1);
#if defined(__ARM_FEATURE_DOTPROD)
  setenv("P25_GEMM", "int8w", 1);
#else
  setenv("P25_GEMM", "exact", 1);
#endif
  unsetenv("P25_CACHE_CODES");
  p25_verbose = 0;
  P25Engine *engine = p25_engine_open(argv[1]);
  if (!engine) {
    fprintf(stderr, "lvengine-phonon: the model did not load from %s\n", argv[1]);
    return 1;
  }
  int status = run(engine);
  p25_engine_close(engine);
  return status;
}
