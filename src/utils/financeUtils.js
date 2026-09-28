export const isSettlement = expense => expense.type === 'Liquidación' || expense.category === 'Cuadre entre socios';
export const isInventoryPurchase = expense => !isSettlement(expense) && expense.category === 'Compra de mercadería';
export const isAffectableExpense = expense => !isSettlement(expense) && Boolean(expense.affectsCapital ?? expense.affects_capital ?? false);
const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
const money = value => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateFinance(sales = [], expenses = []) {
  const contributions = expenses.filter(e => !isSettlement(e));
  const operatingExpenses = contributions.filter(e => !isInventoryPurchase(e));
  const affectableExpenses = contributions.filter(isAffectableExpense);
  const paidByKevin = sum(contributions.filter(e => e.paidBy === 'kevin'), 'amount');
  const paidByLuis = sum(contributions.filter(e => e.paidBy === 'luis'), 'amount');
  const settlements = expenses.filter(isSettlement);
  const repaidByLuis = sum(settlements.filter(e => e.paidBy === 'luis'), 'amount');
  const repaidByKevin = sum(settlements.filter(e => e.paidBy === 'kevin'), 'amount');
  const totalSalesAmount = sum(sales, 'totalAmount');
  const totalCost = sum(sales, 'cost');
  const totalExpenses = sum(operatingExpenses, 'amount');
  const inventoryPurchases = sum(contributions.filter(isInventoryPurchase), 'amount');
  const totalAfectableExpenses = sum(affectableExpenses, 'amount');
  const totalCapital = money(totalSalesAmount - totalAfectableExpenses);

  return {
    totalSalesAmount, totalCost, totalGrossProfit: money(totalSalesAmount - totalCost), totalExpenses,
    inventoryPurchases,
    totalDisbursed: money(totalExpenses + inventoryPurchases),
    netProfit: money(totalSalesAmount - totalCost - totalExpenses),
    paidByKevin, paidByLuis, halfExpense: money((paidByKevin + paidByLuis) / 2),
    debtLuisToKevin: money((paidByKevin - paidByLuis) / 2 - repaidByLuis + repaidByKevin),
    totalAfectableExpenses: money(totalAfectableExpenses),
    totalCapital,
    affectableCount: affectableExpenses.length,
    affectableExpensesCount: affectableExpenses.length,
  };
}

