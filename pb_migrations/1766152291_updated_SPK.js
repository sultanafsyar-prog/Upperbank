/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update collection data
  unmarshal({
    "name": "spk_materials"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update collection data
  unmarshal({
    "name": "SPK"
  }, collection)

  return app.save(collection)
})
