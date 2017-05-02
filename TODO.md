TODO
=====

Menu
-----
* ajouter des icônes devant chacun des items


Page Fiche Équipe
------
* lister les matchs et les heures de passage

Cotes
----
* cote d'une équipe ?
* cote d'un joueur ?
* cotes d'équipes dans un match ?


Paris
----
* Définir les paris possibles
	* vainqueur du match
	* match nul

Divers
-----
* Ajouter une favicon.ico

Page d'accueil
-------
* Ajouter le temps estimé avant le prochain match à jouer par le joueur logué

Page Fiche Joueur
--------
* Ajouter le temps estimé avant le prochain match à jouer par le joueur

Page Ma fiche
---------
* Ajouter le temps estimé avant le prochain match à jouer par le joueur logué

BDD
-----
* Gérer différemment les index : par année c'est pas une bonne idée car ça ne répartit pas les enregistrements d'une même année dans plusieurs partitions et donc ne permet pas une bonne répartition de la charge lors d'accès concurrents. Utiliser plutôt les noms des équipes, etc.