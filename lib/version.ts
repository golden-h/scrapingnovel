interface VersionInfo {
  version: string;
  buildDate: string;
}

export const getVersionInfo = (): VersionInfo => ({
  version: '0.1.13',
  buildDate: '2024-12-17T12:09:39+0000',
});

export const displayVersion = (): string => {
  const { version, buildDate } = getVersionInfo();
  return `Version: ${version} (Built: ${buildDate})`;
};
