// ECOINDEX
// http://www.ecoindex.fr/quest-ce-que-ecoindex/
// Lance la mesure de ecoindex quand la page est fini de charger


/*
* Pour plus d'informations sur ecoindex : 
* http://www.ecoindex.fr/quest-ce-que-ecoindex/
*
*  Copyright (C) 2019  didierfred@gmail.com 
*   *
*  This program is free software: you can redistribute it and/or modify
*   *  it under the terms of the GNU Affero General Public License as published
*  by the Free Software Foundation, either version 3 of the License, or
*   *  (at your option) any later version.
*  This program is distributed in the hope that it will be useful,
*   *  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   *  GNU Affero General Public License for more details.
*  You should have received a copy of the GNU Affero General Public License
*   *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
quantiles_dom = [0, 47, 75, 159, 233, 298, 358, 417, 476, 537, 603, 674, 753, 843, 949, 1076, 1237, 1459, 1801, 2479, 594601];
quantiles_req = [0, 2, 15, 25, 34, 42, 49, 56, 63, 70, 78, 86, 95, 105, 117, 130, 147, 170, 205, 281, 3920];
quantiles_size = [0, 1.37, 144.7, 319.53, 479.46, 631.97, 783.38, 937.91, 1098.62, 1265.47, 1448.32, 1648.27, 1876.08, 2142.06, 2465.37, 2866.31, 3401.59, 4155.73, 5400.08, 8037.54, 223212.26];

/**
Calcul ecoIndex based on formula from web site www.ecoindex.fr
**/
function computeEcoIndex(dom,req,size)
{

	const q_dom= computeQuantile(quantiles_dom,dom);
	const q_req= computeQuantile(quantiles_req,req);
	const q_size= computeQuantile(quantiles_size,size);


	return 100 - 5 * (3*q_dom + 2*q_req + q_size)/6;
}

function computeQuantile(quantiles,value)
{
	for (i=1;i<quantiles.length;i++)
	{
		if (value<quantiles[i]) return (i + (value-quantiles[i-1])/(quantiles[i] -quantiles[i-1]));
	}
	return quantiles.length;
}

function getEcoIndexGrade(ecoIndex)
{
	if (ecoIndex > 75) return "A";
	if (ecoIndex > 65) return "B";
	if (ecoIndex > 50) return "C";
	if (ecoIndex > 35) return "D";
	if (ecoIndex > 20) return "E";
	if (ecoIndex > 5) return "F";
	return "G";
}

function computeGreenhouseGasesEmissionfromEcoIndex(ecoIndex)
{
	return (2 + 2 * (50 - ecoIndex) / 100).toFixed(2);
}
function computeWaterConsumptionfromEcoIndex(ecoIndex)
{
	return (3 + 3 * (50 - ecoIndex) / 100).toFixed(2);
}


// Donne le ecoindex
ecoindex = function(dom, resources)
{
	// Mesure le nombre de REQUETTE
	var size = 0;
	var req = 0;

	// Parcours les ressources pour le nombre de requette et leur poids
	resources.forEach(function(resource) 
	{
		// Nombre de ressource
		req++;

	    // Poids du fichier en octets typeof resource.transferSize !== 'undefined' && 
	    var size_file = 0;
	    if(resource.transferSize == 0)// Si la boucle n'arrive pas à lire le poids du fichier
	    {
		    var request = new XMLHttpRequest();
		    request.open("HEAD", resource.name, false);
		    request.send(null);
			//request.getResponseHeader('content-length');
			/Content\-Length\s*:\s*(\d+)/i.exec(request.getAllResponseHeaders());
		    size_file = parseInt(RegExp.$1);

		    // @todo : Gerer les cas ou il n'y a pas de content-length
	    }
	    else size_file = resource.transferSize;

	    // Poids en Ko
	    //size_file = Math.ceil(size_file / 1024);// Taille en Ko
	    size_file = Math.round(size_file / 1000);// Taille en Ko => même calcule que GreenIT-Analysis (mais moins précis)

	    // Poids total de fichier
	    size = size + size_file;

	    //console.log(resource);
	    console.log(req+' : '+size_file+'Ko | '+resource.transferSize+' | '+resource.initiatorType+' | '+resource.name);
	});


	// Résultat
	var ecoIndex = computeEcoIndex(dom, req, size);
	var EcoIndexGrade = getEcoIndexGrade(ecoIndex)
	var ges = computeGreenhouseGasesEmissionfromEcoIndex(ecoIndex)
	var eau = computeWaterConsumptionfromEcoIndex(ecoIndex)

	// Log
	console.log("ecoIndex: " + ecoIndex);
	console.log("EcoIndexGrade: " + EcoIndexGrade);
	console.log("ges: " + ges);
	console.log("eau: " + eau);
	console.log("dom: " + dom);
	console.log("req: " + req);
	console.log("size: " + size);


	// Affichage dans la barre d'admin
	var ecotitle = 'ecoIndex: '+ecoIndex+' | GES: '+ges+' gCO2e | eau: '+eau+' cl | Nombre de requêtes: '+req+' | Taille de la page: '+size+' Ko | Taille du DOM: '+dom;

	// Ajout de la note dans la barre d'admin
	//<a href="http://www.ecoindex.fr/quest-ce-que-ecoindex/"  id="ecoindex" target="_blank" title="'+ecotitle+'">ecoIndex <span class="'+EcoIndexGrade+'">'+EcoIndexGrade+'</span></a>');
		
}



// La page est fini de charger on lance la mesure d'ecoindex
window.onload = function(event)
{
	// Lancement de la mesure avec un délai pour prendre en compte les scripts en Async
	setTimeout(function()
	{ 
		// Mesure de la DOM
		var dom = document.getElementsByTagName('*').length;

		// Liste les ressources appeler par le navigateur
		var resources = window.performance.getEntriesByType("resource");

		// Ajoute la page courante (type navigation)
		resources.push({name: 'Page HTML', transferSize : window.performance.getEntriesByType("navigation")[0].transferSize});

		// Calcule de la note
		ecoindex(dom, resources);

	}, 1000);			
};