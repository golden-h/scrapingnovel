interface VersionInfo {
  version: string;
  buildDate: string;
}

export const getVersionInfo = (): VersionInfo => ({
  version: '0.1.1',
  buildDate: '2024-12-14T08:44:08+0000',
});

export const displayVersion = (): string => {
  const { version, buildDate } = getVersionInfo();
  return `Version: ${version} (Built: ${buildDate})`;
};
