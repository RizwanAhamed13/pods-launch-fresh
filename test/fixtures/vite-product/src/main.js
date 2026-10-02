const counter = document.querySelector('#counter');
let count = Number(localStorage.getItem('pods-counter') || 0);
const render = () => { counter.textContent = `Count: ${count}`; };
counter.addEventListener('click', () => {
  count += 1;
  localStorage.setItem('pods-counter', String(count));
  render();
});
render();
