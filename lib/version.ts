interface VersionInfo {
  version: string;
  buildDate: string;
  gitCommit?: string;
}

export const getVersionInfo = (): VersionInfo => {
  return {
    version: process.env.npm_package_version || '0.1.0',
    buildDate: '2024-12-14T15:39:54+07:00',
  };
};

export const displayVersion = (): string => {
  const { version, buildDate } = getVersionInfo();
  return `Version: ${version} (Built: ${buildDate})`;
};
