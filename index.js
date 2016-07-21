import {send} from 'micro-core';
import fetch from 'node-fetch';
import apropokemon from '@quarterto/apropokemon';
import sanitizePokemonName from '@quarterto/sanitize-pokemon-name';
import parseSlackBody from '@quarterto/slack-body';

const getMon = mon => fetch(`http://pokeapi.co/api/v2/pokemon/${mon}`);
const getDex = mon => fetch(`http://pokeapi.co/api/v2/pokemon-species/${mon}`);
const coolOffSet = new Set();
const coolOff = mon => {
	if (!coolOffSet.has(mon)) {
		coolOffSet.add(mon);
		setTimeout(() => coolOffSet.delete(mon), 10000);
	}
}

const getFlavourText = pokedexEntry => pokedexEntry.flavor_text_entries.find(entry => entry.language.name === 'en' && entry.version.name === 'alpha-sapphire').flavor_text;

const getName = pokedexEntry => pokedexEntry.names.find(entry => entry.language.name === 'en').name;

const getTypeColor = type => ({
	normal: '#A8A77A',
	fire: '#EE8130',
	water: '#6390F0',
	electric: '#F7D02C',
	grass: '#7AC74C',
	ice: '#96D9D6',
	fighting: '#C22E28',
	poison: '#A33EA1',
	ground: '#E2BF65',
	flying: '#A98FF3',
	psychic: '#F95587',
	bug: '#A6B91A',
	rock: '#B6A136',
	ghost: '#735797',
	dragon: '#6F35FC',
	dark: '#705746',
	steel: '#B7B7CE',
	fairy: '#D685AD',
})[type];

const getPrimaryType = mon => mon.types.find(entry => entry.slot === 1).type.name;

export default async function(req, res) {
	const {text} = await parseSlackBody(req);
	const mons = Array.from(new Set(apropokemon(text).map(sanitizePokemonName))).filter((mon) => !coolOffSet.has(mon));
	mons.forEach(coolOff)

	if(mons.length) {
		send(res, 200, {
			attachments: await Promise.all(mons.map(async mon => {
				const [data, dex] = await Promise.all([
					(await getMon(mon)).json(),
					(await getDex(mon)).json(),
				]);

				return {
					title: getName(dex),
					image_url: (Math.random() < 1/8192 ? data.sprites.front_shiny : data.sprites.front_default),
					footer: getFlavourText(dex),
					color: getTypeColor(getPrimaryType(data)),
			 	};
			}))
		});
	} else send(res, 200, {});
}
