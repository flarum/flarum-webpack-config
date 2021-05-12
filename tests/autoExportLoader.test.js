/**
 * @jest-environment node
 */
import compiler from './compiler.js';
import "regenerator-runtime/runtime";

test('Inserts name and outputs JavaScript', async () => {
    const stats = await compiler('example/example.js', { name: 'Alice' });
    const output = stats.toJson({ source: true }).modules[0].source;

    expect(output).toBe('export default "Hey Alice!\\n"');
});