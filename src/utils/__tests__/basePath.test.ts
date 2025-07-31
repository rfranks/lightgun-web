// Tests for withBasePath utility

describe('withBasePath', () => {
  const ORIGINAL_ENV = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_PATH = ORIGINAL_ENV;
    jest.resetModules();
  });

  test('returns path unchanged when BASE_PATH is empty', async () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    jest.resetModules();
    const { withBasePath } = await import('../basePath');
    expect(withBasePath('/foo')).toBe('/foo');
  });

  test('prefixes path when BASE_PATH is set', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/base';
    jest.resetModules();
    const { withBasePath } = await import('../basePath');
    expect(withBasePath('/foo')).toBe('/base/foo');
  });
});
