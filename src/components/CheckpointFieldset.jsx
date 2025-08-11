import React from "react";

export default function CheckpointFieldset({
  index,
  data,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange({ lat: latitude.toFixed(6), lng: longitude.toFixed(6) });
      },
      (err) => alert(err?.message || "Failed to get location."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <fieldset className="cp-fieldset">
      <legend>Checkpoint {index + 1}</legend>

      <div className="cp-grid">
        <div className="field">
          <label htmlFor={`title-${index}`}>Title<span className="req">*</span></label>
          <input
            id={`title-${index}`}
            type="text"
            placeholder="e.g., Library Steps"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor={`riddle-${index}`}>Riddle / Clue<span className="req">*</span></label>
          <textarea
            id={`riddle-${index}`}
            rows="3"
            placeholder="Write a clue players must solve on-site"
            value={data.riddle}
            onChange={(e) => onChange({ riddle: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor={`answer-${index}`}>Answer<span className="req">*</span></label>
          <input
            id={`answer-${index}`}
            type="text"
            placeholder="Expected answer"
            value={data.answer}
            onChange={(e) => onChange({ answer: e.target.value })}
          />
        </div>

        <div className="inline-3">
          <div className="field">
            <label htmlFor={`lat-${index}`}>Latitude<span className="req">*</span></label>
            <input
              id={`lat-${index}`}
              type="number"
              step="0.000001"
              placeholder="40.712800"
              value={data.lat}
              onChange={(e) => onChange({ lat: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor={`lng-${index}`}>Longitude<span className="req">*</span></label>
            <input
              id={`lng-${index}`}
              type="number"
              step="0.000001"
              placeholder="-74.006000"
              value={data.lng}
              onChange={(e) => onChange({ lng: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor={`tol-${index}`}>Tolerance (m)<span className="req">*</span></label>
            <input
              id={`tol-${index}`}
              type="number"
              min="5"
              step="1"
              value={data.toleranceRadius}
              onChange={(e) => onChange({ toleranceRadius: e.target.value })}
            />
          </div>
        </div>

        <div className="cp-actions">
          <button type="button" className="btn slim" onClick={useMyLocation}>
            Use My Location
          </button>
          {/* If we later add a map picker, hook it here */}
          {/* <button type="button" className="btn slim" onClick={() => onOpenMap(index)}>Pick on Map</button> */}
          <div className="spacer" />
          <button type="button" className="btn slim" onClick={onMoveUp} title="Move up">↑</button>
          <button type="button" className="btn slim" onClick={onMoveDown} title="Move down">↓</button>
          <button type="button" className="btn danger slim" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </fieldset>
  );
}
