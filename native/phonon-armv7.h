/* AArch64 NEON intrinsics used by Phonon, expressed with ARMv7 NEON. */
#include <arm_neon.h>

static inline float vaddvq_f32(float32x4_t v) {
  float32x2_t pair = vpadd_f32(vget_low_f32(v), vget_high_f32(v));
  return vget_lane_f32(vpadd_f32(pair, pair), 0);
}

static inline float vmaxvq_f32(float32x4_t v) {
  float32x2_t pair = vpmax_f32(vget_low_f32(v), vget_high_f32(v));
  return vget_lane_f32(vpmax_f32(pair, pair), 0);
}

static inline uint8x16_t vqtbl1q_u8(uint8x16_t table, uint8x16_t index) {
  uint8x8x2_t halves = {{vget_low_u8(table), vget_high_u8(table)}};
  return vcombine_u8(vtbl2_u8(halves, vget_low_u8(index)), vtbl2_u8(halves, vget_high_u8(index)));
}

static inline int16x8_t vmovl_high_s8(int8x16_t v) { return vmovl_s8(vget_high_s8(v)); }
static inline int32x4_t vmovl_high_s16(int16x8_t v) { return vmovl_s16(vget_high_s16(v)); }

/* The exp approximation rounds small exponents to the nearest integer. */
static inline float32x4_t vrndnq_f32(float32x4_t v) {
  float32x4_t half = vdupq_n_f32(0.5f);
  float32x4_t bias = vbslq_f32(vcltq_f32(v, vdupq_n_f32(0)), vnegq_f32(half), half);
  return vcvtq_f32_s32(vcvtq_s32_f32(vaddq_f32(v, bias)));
}

/* Swish divides by 1 + exp(-x), so the denominator is positive. */
static inline float32x4_t vdivq_f32(float32x4_t num, float32x4_t den) {
  float32x4_t reciprocal = vrecpeq_f32(den);
  reciprocal = vmulq_f32(reciprocal, vrecpsq_f32(den, reciprocal));
  reciprocal = vmulq_f32(reciprocal, vrecpsq_f32(den, reciprocal));
  return vmulq_f32(num, reciprocal);
}
