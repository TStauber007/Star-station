"""Build-time only. Reassembles the Kokoro-82M q8 ONNX model from the npm
shards and exposes the per-phoneme duration tensor as a second output, so
narration can be highlighted word by word."""
import hashlib, pathlib, onnx

HERE = pathlib.Path(__file__).parent
SHARDS = HERE / "node_modules/kokoro-q8-shards"
OUT = HERE / "model"
SHA = "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478"
DUR = "/encoder/Clip_output_0"

def main():
    OUT.mkdir(exist_ok=True)
    raw = b"".join((SHARDS / f"kokoro-q8.part{i}.bin").read_bytes() for i in range(6))
    assert hashlib.sha256(raw).hexdigest() == SHA, "model checksum mismatch"
    (OUT / "model_quantized.onnx").write_bytes(raw)
    m = onnx.load_from_string(raw)
    if not any(o.name == DUR for o in m.graph.output):
        m.graph.output.append(onnx.helper.make_tensor_value_info(DUR, onnx.TensorProto.FLOAT, None))
    onnx.save(m, str(OUT / "kokoro-dur.onnx"))
    print("ok", OUT / "kokoro-dur.onnx")

if __name__ == "__main__":
    main()
