export function isDev(): boolean {
    return process.env.NODE_ENV === 'development';
}

export function getPythonCommand(): string {
    return process.platform === 'win32' ? 'python' : 'python3';
}