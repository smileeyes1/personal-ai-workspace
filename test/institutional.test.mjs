import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Mathematical Visual Order and Group Counting Deterministic Helper
function renderMathExpression(operand1, operator, operand2, result) {
  // Always render in a strictly isolated LTR segment for consistent display in RTL pages
  return `<span class="math-expr" dir="ltr" data-op="${operator}">${operand1} ${operator} ${operand2} = ${result}</span>`;
}

function validateNumericalGroup(targetCount, visualItems) {
  const actualCount = visualItems.length;
  return {
    valid: targetCount === actualCount,
    targetCount,
    actualCount,
    difference: actualCount - targetCount
  };
}

describe('Institutional HAKIM Ω Pedagogical & Math Logic Tests', () => {
  it('renders mathematical expressions with explicit LTR isolation to prevent BiDi confusion', () => {
    const expr = renderMathExpression('5', '+', '3', '8');
    assert.match(expr, /dir="ltr"/);
    assert.match(expr, /5 \+ 3 = 8/);
  });

  it('validates numerical visual group matching 100% strictly', () => {
    const apples = ['🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎'];
    const checkPass = validateNumericalGroup(7, apples);
    assert.equal(checkPass.valid, true);
    assert.equal(checkPass.actualCount, 7);

    const checkFail = validateNumericalGroup(8, apples);
    assert.equal(checkFail.valid, false);
    assert.equal(checkFail.difference, -1);
  });
});
