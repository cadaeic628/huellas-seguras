// Modal de cámara para web usando getUserMedia (webcam del PC o cámara del
// teléfono si se accede desde un navegador móvil).
//
// expo-image-picker en web NO abre la cámara real: solo despliega el file
// picker. Por eso en web reemplazamos ese flujo con este modal.

import React, { useEffect, useRef, useState } from 'react';

const overlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.92)',
  zIndex: 10000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  boxSizing: 'border-box',
};

const button = {
  padding: '10px 18px',
  borderRadius: 24,
  border: 'none',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

const primary = { ...button, background: '#2A9D8F', color: 'white' };
const ghost = {
  ...button,
  background: 'transparent',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.4)',
};

export default function WebCamera({ visible, onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    setReady(false);
    setError(null);

    async function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          'Tu navegador no soporta acceso a la cámara. Usa la opción de galería.'
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play().catch(() => {});
            setReady(true);
          };
        }
      } catch (e) {
        const msg =
          e?.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Habilítalo desde la barra del navegador.'
            : e?.message || 'No se pudo acceder a la cámara.';
        setError(msg);
      }
    }
    start();

    return () => {
      cancelled = true;
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
      setReady(false);
    };
  }, [visible]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCapture(dataUrl);
  }

  if (!visible) return null;

  return (
    <div style={overlay}>
      {error ? (
        <>
          <div
            style={{
              color: 'white',
              maxWidth: 360,
              textAlign: 'center',
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
          <button onClick={onClose} style={primary}>
            Cerrar
          </button>
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={{
              maxWidth: '90vw',
              maxHeight: '70vh',
              borderRadius: 12,
              background: 'black',
            }}
          />
          <div
            style={{
              marginTop: 18,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <button onClick={onClose} style={ghost}>
              Cancelar
            </button>
            <button
              onClick={capture}
              disabled={!ready}
              style={{
                ...primary,
                opacity: ready ? 1 : 0.6,
                cursor: ready ? 'pointer' : 'wait',
              }}
            >
              {ready ? '📸 Tomar foto' : 'Cargando cámara…'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
