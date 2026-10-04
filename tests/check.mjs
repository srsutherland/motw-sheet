// Minimal assertions for the test scripts: print PASS/FAIL per check, exit 1 if any failed.

let failures = 0;

const check = (label, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) {
        failures++;
    }
    const expectedText = ok ? '' : ` (expected ${JSON.stringify(expected)})`;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}${expectedText}`);
};

const finish = () => {
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
};

export { check, finish };
