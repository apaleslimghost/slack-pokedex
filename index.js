import {send} from 'micro-core';
import fetch from 'node-fetch';
import isPokemon from '@quarterto/is-pokemon';
import sanitizePokemonName from '@quarterto/sanitize-pokemon-name';
import parseSlackBody from '@quarterto/slack-body';
import {words} from 'lodash';

const getMon = mon => fetch(`http://pokeapi.co/api/v2/pokemon/${mon}`);
const getDex = mon => fetch(`http://pokeapi.co/api/v2/pokemon-species/${mon}`);

const getFlavourText = pokedexEntry => pokedexEntry.flavor_text_entries.find(entry => entry.language.name === 'en' && entry.version.name === 'alpha-sapphire').flavor_text;

const getName = pokedexEntry => pokedexEntry.names.find(entry => entry.language.name === 'en').name;

export default async function(req, res) {
	const body = await parseSlackBody(req);
	console.log(body);
	const {text} = body;
	const w = words(text);
	const mons = w.map(sanitizePokemonName).filter(isPokemon);


	if(mons.length) {
		send(res, 200, {
			attachments: await Promise.all(mons.map(async mon => {
				const data = await (await getMon(mon)).json();
				const dex = await (await getDex(mon)).json();
				return {
					title: getName(dex),
					image_url: (Math.random() < 1/8192 ? data.sprites.front_shiny : data.sprites.front_default),
					footer: getFlavourText(dex),
			 	};
			}))
		});
	} else send(res, 200, {});
}
