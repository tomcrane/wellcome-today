import requests
import sys
from random import shuffle

def main():    
    ids = []
    with open("ids.txt") as f:
        ids = [x.strip() for x in f.readlines()]

    shuffle(ids)
    template = "https://wellcomelibrary.org/iiif/{0}/manifest"
    items = ""
    for id in ids:
        print("fetching " + id)
        resp = requests.get(template.format(id))
        iiif = resp.json()
        if iiif["@type"] == "sc:Collection":
            print("A collection, so getting first manifest")
            resp = requests.get(iiif["manifests"][0]["@id"])
            iiif = resp.json()
        viewerlink = "http://tomcrane.github.io/wellcome-today/thumbs.html?manifest=https://wellcomelibrary.org/iiif/{0}/manifest".format(id)
        thumb = '\n<a href="{0}"><img src="{1}/full/{2},{3}/0/default.jpg" /></a>'
        s = '\n\n<div class="item"><a href="{0}">\n{1}</a><br/><div class="strip">'.format(viewerlink, iiif["label"])
        counter = 0
        for cv in iiif["sequences"][0]["canvases"]:
            service =  cv["thumbnail"]["service"]
            size = service["sizes"][0]
            s = s + thumb.format(viewerlink, service["@id"], size["width"], size["height"])
            counter = counter + 1
            if counter == 10:
                s = s + '\n <a href="{0}">more...</a>'.format(viewerlink)
                break
        s = s + "\n</div></div>"
        items = items + s

    with open("gallery-template.html") as f:
        gallery = f.read().replace("$replace_me$", items)

    with open("gallery.html", "w") as g:
        g.write(gallery)
        

if __name__ == "__main__":
    main()