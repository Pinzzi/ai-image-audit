use wasm_bindgen::prelude::*;
use image::{DynamicImage, GenericImageView};
use serde::{Serialize, Deserialize};
use base64::decode;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[derive(Serialize, Deserialize)]
pub struct AnalysisResult {
    pub texture_score: f64,
    pub frequency_energy: f64,
    pub confidence: f64,
    pub message: String,
}

#[wasm_bindgen]
pub fn analyze_image(base64: &str) -> JsValue {
    match decode_base64_to_image(base64) {
        Ok(img) => {
            let (texture_score, frequency_energy) = calculate_texture_and_fft(&img);
            let confidence = ((texture_score / 50.0) + (frequency_energy / 200.0)).min(1.0);
            let message = if confidence > 0.85 {
                "可能为 AI 合成图像"
            } else if confidence > 0.5 {
                "疑似 AI 合成，请人工复核"
            } else {
                "看起来是自然拍摄图像"
            };

            let result = AnalysisResult {
                texture_score,
                frequency_energy,
                confidence,
                message: message.to_string(),
            };

            JsValue::from_serde(&result).unwrap()
        }
        Err(e) => JsValue::from_serde(&AnalysisResult {
            texture_score: 0.0,
            frequency_energy: 0.0,
            confidence: 0.0,
            message: format!("图像解析失败: {}", e),
        }).unwrap(),
    }
}

fn decode_base64_to_image(base64_str: &str) -> Result<DynamicImage, String> {
    let decoded = decode(base64_str).map_err(|e| e.to_string())?;
    let img = image::load_from_memory(&decoded).map_err(|e| e.to_string())?;
    Ok(img)
}

fn calculate_texture_and_fft(img: &DynamicImage) -> (f64, f64) {
    let gray = img.to_luma8();
    let (width, height) = gray.dimensions();
    let pixels: Vec<f64> = gray.pixels().map(|p| p.0[0] as f64).collect();

    // 纹理复杂度（标准差）
    let mean = pixels.iter().sum::<f64>() / pixels.len() as f64;
    let texture = (pixels.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / pixels.len() as f64).sqrt();

    // 简化频率能量计算：sobel 近似（不使用完整 FFT）
    let mut energy = 0.0;
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let dx = gray.get_pixel(x + 1, y)[0] as f64 - gray.get_pixel(x - 1, y)[0] as f64;
            let dy = gray.get_pixel(x, y + 1)[0] as f64 - gray.get_pixel(x, y - 1)[0] as f64;
            energy += dx.abs() + dy.abs();
        }
    }

    (texture, energy / ((width * height) as f64))
}
