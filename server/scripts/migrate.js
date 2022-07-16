const db = require("../db");
const fs = require('fs');

(async ()=> {
    await db.connect();
    let c = 0;
    try {
        const resource_ids = JSON.parse(fs.readFileSync("./resource_ids.txt", {encoding: 'utf-8'}));
        //const docs = (await db.Photos.find({big_preview: {$exists: true, $ne: null}}));
        const docs = await db.Photos.find({resource_id: {$in: resource_ids}});
        const photos = docs.map((d) => d.toObject());

        let proc = async (p) => {
            let bp = new db.PhotoBigPreviews({
                resource_id: p.resource_id,
                big_preview: p.big_preview
            });
            await bp.save();
            await db.Photos.findOneAndUpdate({_id: p._id}, {$set: {big_preview: null}});
            console.log(`Photo resource_id ${p.resource_id} updated.`);
            c++;
        };

        await Promise.all(photos.map(proc));        
        console.log(`${c} photos migrated`);
    } catch (e) {
        console.log(e);
    }
})();