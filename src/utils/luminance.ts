/**
 * AEメタデータの照度指標値からlux近似値を算出する
 *
 * 実測キャリブレーションポイント間を線形補間する。
 * ポイントを追加・調整することで精度を改善できる。
 */

// [indicator, lux] の実測キャリブレーションテーブル（indicator昇順）
const CALIBRATION: [number, number][] = [
  [0, 0],
  [0.0161, 4],
  [0.1330, 392],
  [0.3472, 915],
];

export function luminanceToLux(indicator: number): number {
  if (indicator <= 0) return 0;

  // テーブル内を線形補間
  for (let i = 1; i < CALIBRATION.length; i++) {
    const [x0, y0] = CALIBRATION[i - 1];
    const [x1, y1] = CALIBRATION[i];
    if (indicator <= x1) {
      const t = (indicator - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }

  // テーブル範囲外は最後の2点から外挿
  const [x0, y0] = CALIBRATION[CALIBRATION.length - 2];
  const [x1, y1] = CALIBRATION[CALIBRATION.length - 1];
  const slope = (y1 - y0) / (x1 - x0);
  return y1 + slope * (indicator - x1);
}
