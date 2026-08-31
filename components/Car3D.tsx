"use client";

type SpotView = {
  id: number;
};

export default function Car3D({
  onPick,
}: {
  spots?: SpotView[];
  onPick?: (id: number) => void;
}) {
  void onPick;
  return (
    <div className="car-canvas" aria-label="2018 Tesla Model 3, drag to spin">
      <iframe
        title="2018 Tesla Model 3"
        src="https://sketchfab.com/models/5ef9b845aaf44203b6d04e2c677e444f/embed?autostart=1&preload=1&ui_theme=dark&ui_infos=0&ui_watermark=0&ui_help=0&ui_settings=0&ui_vr=0&ui_ar=0&ui_annotations=0&dnt=1&camera=0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
      />
      <p className="model-credit">
        3D model:{" "}
        <a href="https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f" target="_blank" rel="noreferrer">
          Tesla 2018 Model 3
        </a>{" "}
        by Ameer Studio, CC BY
      </p>
    </div>
  );
}
