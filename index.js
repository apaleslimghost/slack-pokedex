import {send} from 'micro-core';
import apropokemon from '@quarterto/apropokemon';
import sanitizePokemonName from '@quarterto/sanitize-pokemon-name';
import pokemonDetails from 'pokemon-details';
import parseSlackBody from '@quarterto/slack-body';

const COOLOFF_LENGTH = 1 * 60 * 1e3;

const coolOffSet = new Set();
const coolOff = mon => {
	if (!coolOffSet.has(mon)) {
		coolOffSet.add(mon);
		setTimeout(() => coolOffSet.delete(mon), COOLOFF_LENGTH);
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
			attachments: mons.map(mon => {
				const {pokemon, species} = pokemonDetails(mon);

				return {
					author_name: getName(species),
					image_url: (Math.random() < 1/8192 ? pokemon.sprites.front_shiny : pokemon.sprites.front_default),
					footer: getFlavourText(species),
					color: getTypeColor(getPrimaryType(pokemon)),
			 	};
			})
		});
	} else send(res, 200, {});
}
