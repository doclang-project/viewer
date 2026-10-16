// In-browser OCR of a cropped bbox with Granite-Docling (258M), run off the main thread.
// Transformers.js + ONNX Runtime on WebGPU, following the ibm-granite/granite-docling-258M-WebGPU demo.
// The library and the model weights are fetched on the first request and cached by the browser.

const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5";
const MODEL_ID = "onnx-community/granite-docling-258M-ONNX";

let loading = null;
let model = null;
let processor = null;
let RawImage = null;
let TextStreamer = null;
/** Reports download progress (0-100) to whoever asked for the model. */
let reportProgress = () => {};

function load() {
  loading ??= (async () => {
    const tf = await import(TRANSFORMERS_URL);
    ({ RawImage, TextStreamer } = tf);
    processor = await tf.AutoProcessor.from_pretrained(MODEL_ID);
    const files = {};
    model = await tf.AutoModelForVision2Seq.from_pretrained(MODEL_ID, {
      dtype: { embed_tokens: "fp16", vision_encoder: "fp32", decoder_model_merged: "fp32" },
      device: "webgpu",
      progress_callback: (data) => {
        if (data.status !== "progress" || !data.file?.endsWith?.("onnx_data")) return;
        files[data.file] = data;
        const all = Object.values(files);
        if (all.length !== 3) return; // the three weight files: report once all have started
        const loaded = all.reduce((sum, f) => sum + f.loaded, 0);
        const total = all.reduce((sum, f) => sum + f.total, 0);
        reportProgress(Math.round((loaded / total) * 100));
      },
    });
  })().catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

async function read({ pixels, width, height, prompt }, onReading) {
  await load();
  onReading();
  const image = new RawImage(new Uint8ClampedArray(pixels), width, height, 4).rgb();
  const text = processor.apply_chat_template(
    [{ role: "user", content: [{ type: "image" }, { type: "text", text: prompt }] }],
    { add_generation_prompt: true },
  );
  const inputs = await processor(text, [image], { do_image_splitting: true });
  let out = "";
  await model.generate({
    ...inputs,
    max_new_tokens: 1024,
    streamer: new TextStreamer(processor.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: false,
      callback_function: (chunk) => {
        out += chunk;
      },
    }),
  });
  return out;
}

self.addEventListener("message", async (e) => {
  const { id, ...request } = e.data;
  reportProgress = (percent) => self.postMessage({ id, type: "progress", percent });
  try {
    self.postMessage({ id, type: "result", text: await read(request, () => self.postMessage({ id, type: "reading" })) });
  } catch (err) {
    self.postMessage({ id, type: "error", message: err?.message ?? String(err) });
  }
});
