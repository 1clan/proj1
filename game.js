const output = document.querySelector('#output');
const form = document.querySelector('#command-form');
const input = document.querySelector('#command');

const rooms = {
  camp: { name: 'Base camp', text: 'A warm console hums beside a trail leading north.', exits: { north: 'forest' } },
  forest: { name: 'Whispering forest', text: 'Pines click in the wind. A rusty compass glints here. Paths lead south and east.', exits: { south: 'camp', east: 'ridge' }, item: 'compass' },
  ridge: { name: 'Signal ridge', text: 'A silent antenna points at the stars. The signal is close.', exits: { west: 'forest' } }
};
let state;

function print(text, kind = '') { const p = document.createElement('p'); p.className = `line ${kind}`; p.textContent = text; output.append(p); output.scrollTop = output.scrollHeight; }
function reset() { state = { room: 'camp', battery: 8, bag: [], won: false }; output.replaceChildren(); print('TERMINAL TREK v1.0', 'success'); print('Your field terminal wakes. Type "help" for commands.'); look(); }
function look() { const room = rooms[state.room]; print(`\n${room.name}\n${room.text}`); if (room.item && !state.bag.includes(room.item)) print(`You see: ${room.item}.`, 'muted'); }
function move(direction) { const next = rooms[state.room].exits[direction]; if (!next) return print('You cannot go that way.'); state.room = next; state.battery--; look(); if (state.room === 'ridge' && state.bag.includes('compass')) { state.won = true; print('\nSignal locked. You found your way home — you win! Type restart to play again.', 'success'); } else if (state.battery <= 0) print('Your battery is flat. Type restart to try again.', 'success'); }
function run(raw) {
  const [verb, ...args] = raw.trim().toLowerCase().split(/\s+/); const arg = args.join(' ');
  if (!verb) return;
  print(`➜ ~/trek $ ${raw}`, 'command');
  if (verb === 'help') print('look — inspect your location\ngo <north|south|east|west> — travel\ntake <item> — pick something up\ninventory — view your bag\nstatus — check battery\nrestart — new game');
  else if (verb === 'look') look();
  else if (verb === 'go') state.won || state.battery <= 0 ? print('The trek is over. Type restart.') : move(arg);
  else if (verb === 'take') { const room = rooms[state.room]; if (arg === room.item && !state.bag.includes(arg)) { state.bag.push(arg); print(`Taken: ${arg}.`, 'success'); } else print('There is nothing like that here.'); }
  else if (verb === 'inventory' || verb === 'i') print(state.bag.length ? `Bag: ${state.bag.join(', ')}` : 'Your bag is empty.');
  else if (verb === 'status') print(`Battery: ${state.battery}/8`);
  else if (verb === 'restart') reset();
  else print(`Unknown command: ${verb}. Try help.`);
}
form.addEventListener('submit', (event) => { event.preventDefault(); run(input.value); input.value = ''; });
document.querySelector('.terminal').addEventListener('click', () => input.focus());
reset();
