export interface DiceRoll {
  expression: string;
  result: number;
  breakdown: string;
  individual: Array<{
    dice: string;
    rolls: number[];
    sum: number;
  }>;
  modifier: number;
  total: number;
}

export function parseDiceExpression(expression: string): DiceRoll {
  // Clean the expression
  const cleanExpression = expression.replace(/\s+/g, '').toLowerCase();
  
  // Split by + and - while keeping the operators
  const parts = cleanExpression.split(/([+-])/).filter(part => part !== '');
  
  let total = 0;
  let modifier = 0;
  const individual: Array<{ dice: string; rolls: number[]; sum: number; }> = [];
  const breakdownParts: string[] = [];
  
  let currentSign = 1; // 1 for positive, -1 for negative
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part === '+') {
      currentSign = 1;
      continue;
    } else if (part === '-') {
      currentSign = -1;
      continue;
    }
    
    // Check if it's a dice expression (XdY format)
    const diceMatch = part.match(/^(\d+)d(\d+)$/);
    if (diceMatch) {
      const count = parseInt(diceMatch[1]);
      const sides = parseInt(diceMatch[2]);
      
      if (count > 100 || sides > 1000 || count < 1 || sides < 2) {
        throw new Error(`Invalid dice: ${part}`);
      }
      
      const rolls: number[] = [];
      for (let j = 0; j < count; j++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      
      const sum = rolls.reduce((a, b) => a + b, 0);
      const adjustedSum = sum * currentSign;
      
      individual.push({
        dice: part,
        rolls,
        sum: adjustedSum
      });
      
      total += adjustedSum;
      
      if (currentSign === 1) {
        breakdownParts.push(`${part}[${rolls.join(',')}]=${sum}`);
      } else {
        breakdownParts.push(`-${part}[${rolls.join(',')}]=-${sum}`);
      }
      
    } else {
      // Check if it's a number (modifier)
      const numberMatch = part.match(/^(\d+)$/);
      if (numberMatch) {
        const value = parseInt(numberMatch[1]) * currentSign;
        modifier += value;
        total += value;
        
        if (currentSign === 1) {
          breakdownParts.push(`+${numberMatch[1]}`);
        } else {
          breakdownParts.push(`-${numberMatch[1]}`);
        }
      } else {
        throw new Error(`Invalid expression part: ${part}`);
      }
    }
    
    // Reset sign for next iteration (default positive)
    if (i + 1 < parts.length && parts[i + 1] !== '+' && parts[i + 1] !== '-') {
      currentSign = 1;
    }
  }
  
  return {
    expression: cleanExpression,
    result: total - modifier, // Dice results without modifier
    breakdown: breakdownParts.join(' '),
    individual,
    modifier,
    total
  };
}

export function formatDiceResult(roll: DiceRoll): string {
  let result = `🎲 ${roll.expression}`;
  
  if (roll.individual.length > 0) {
    const diceBreakdown = roll.individual
      .map(d => `${d.dice}[${d.rolls.join(',')}]=${Math.abs(d.sum)}`)
      .join(' ');
    result += ` → ${diceBreakdown}`;
    
    if (roll.modifier !== 0) {
      result += ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}`;
    }
    
    result += ` = ${roll.total}`;
  } else {
    result += ` = ${roll.total}`;
  }
  
  return result;
}

// Examples:
// "1d20+4" → 1d20[15] +4 = 19
// "2d6+1d4+2" → 2d6[3,5] +1d4[2] +2 = 12
// "3d8-2" → 3d8[4,6,1] -2 = 9
