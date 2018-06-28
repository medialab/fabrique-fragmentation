# deps
import pymysql.cursors
import itertools
from collections import defaultdict
from pprint import pprint
import json


# Connect to the database
connection = pymysql.connect(host='localhost',
                             user='root',
                             password='root',
                             db='nosdeputes',
                             charset='utf8',
                             cursorclass=pymysql.cursors.DictCursor)


with connection.cursor() as cursor:
    
    cursor.execute(""" SELECT id, id_dossier_an from texteloi""")
    ids_dossier_an = {c["id"]:c["id_dossier_an"] for c in cursor}


    cursor.execute("""SELECT amendement_id, parlementaire_id, parlementaire_groupe_acronyme
    FROM parlementaire_amendement""")
    amd_parlementaires_index = defaultdict(list)
    for p in cursor:
        amd_parlementaires_index[int(p['amendement_id'])].append({"id":p['parlementaire_id'],"groupe":p['parlementaire_groupe_acronyme']})
    
    print("liste des signataires par amendement")
    
    cursor.execute("""SELECT content_md5, texteloi_id, sujet, id
            FROM amendement
            WHERE sort !='rectifié'
            ORDER BY texteloi_id, sujet, content_md5;
    """)
    output={}
    for texteloi_id,txtamds in itertools.groupby(cursor,key=lambda a : (a['texteloi_id']) ):
        # some text doesn't have dossier info, boogheta says we can discard them for now
        if texteloi_id not in ids_dossier_an :
            break
        print("texte %s"%texteloi_id)
        if texteloi_id not in output :
            output[ids_dossier_an[texteloi_id]] = {}
        output[ids_dossier_an[texteloi_id]][texteloi_id] = {} 
        for article,amds in itertools.groupby(txtamds,key=lambda a : (a['sujet']) ):
            amds= list(amds)
            print("article %s %s amds"%(article,len(amds)))
            
            liste_liste_signataires = []
            groupes_nb_internal_cosign = defaultdict(int)
            groupes_nb_parlementaire = defaultdict(list)
            inter_groupe = 0
            
            for uniqueAmds,duplicates in itertools.groupby(amds,key=lambda a : a['content_md5'] ):
            
                duplicates = list(duplicates)
                if len(list(duplicates)) > 1:
                    print("dup for %s"%uniqueAmds)
                
                signataires_ids = set()
                signataires = []
                for d in duplicates:
                    for parlementaire in amd_parlementaires_index[d['id']]:
                        if parlementaire['id'] not in signataires_ids:
                            signataires_ids.add(parlementaire['id'])
                            signataires.append(parlementaire)
                #signataires = list({parlementaire['id']:parlementaire for d in duplicates for parlementaire in parlementairesIndex[d['id']]}.values())
                
                for s in signataires:
                    groupes_nb_parlementaire[s['groupe']].append(s)
                for (p1, p2) in itertools.combinations(signataires,2):
                    if p1['groupe'] != p2['groupe']:
                        inter_groupe += 1
                    else:
                        groupes_nb_internal_cosign[p1['groupe']] += 1

                liste_liste_signataires.append(signataires)
            # count unique parlementaire
            groupes_nb_parlementaire = {g: len({p['id']:p for p in ps}.values()) for g,ps in groupes_nb_parlementaire.items()}
            output[ids_dossier_an[texteloi_id]][texteloi_id][article]={
                'groups':{g:{'nc':cosign, 'np':groupes_nb_parlementaire[g]} for g,cosign in groupes_nb_internal_cosign.items()},
                'inter_cosign':inter_groupe,
                'sign_amend':liste_liste_signataires
            }
    with open('../app/data/cosign.json','w') as outputfile:
        json.dump(output, outputfile, indent=2)