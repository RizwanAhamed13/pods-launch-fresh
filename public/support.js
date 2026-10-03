const search = document.querySelector('#stack-search');
const rows = [...document.querySelectorAll('tbody tr')];
search.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase();
  for (const row of rows) row.hidden = !row.querySelector('th').textContent.toLocaleLowerCase().includes(query);
  const count = rows.filter(row => !row.hidden).length;
  document.querySelector('#match-count').textContent = count ? `${count} application${count === 1 ? '' : 's'} shown` : 'No tested application matches. Try a framework, language or database name.';
});
