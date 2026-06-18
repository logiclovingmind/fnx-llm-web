'use client';

import Background from './Background';
import Particles from './Particles';
import Ingest from './Ingest';
import Core from './Core';
import CameraRig from './CameraRig';
import Effects from './Effects';

export default function World() {
  return (
    <>
      <Background />
      <Particles />
      <Ingest />
      <Core />
      <CameraRig />
      <Effects />
    </>
  );
}
