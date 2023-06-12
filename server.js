const express = require("express");
const fs = require("fs");

const app = express();
const port = 8080;

app.use(express.json());

class ProductManager {
  constructor(path) {
    this.path = path;
    this.products = [];
    this.nextId = 1;
    this.load();
  }

  addProduct(product) {
    if (this.products.some((p) => p.code === product.code)) {
      console.log(`Error: El producto con código ${product.code} ya existe`);
      return;
    }

    const newProduct = { id: this.nextId++, ...product };
    this.products.push(newProduct);
    this.save();
    return newProduct;
  }

  getProducts() {
    this.load();
    return this.products;
  }

  getProductById(id) {
    this.load();
    const product = this.products.find((p) => p.id === id);
    if (product) {
      return product;
    } else {
      console.log("Error: Producto no encontrado");
      return null;
    }
  }

  updateProduct(id, product) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.products[index] = { id, ...product };
      this.save();
    } else {
      console.log(`Error: Producto con id ${id} no encontrado`);
    }
  }

  deleteProduct(id) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      this.save();
    } else {
      console.log(`Error: Producto con id ${id} no encontrado`);
    }
  }

  load() {
    try {
      const data = fs.readFileSync(this.path);
      this.products = JSON.parse(data);
      this.nextId = this.products.length + 1;
    } catch (error) {
      console.log(`Error al cargar archivo: ${error}`);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.products));
    } catch (error) {
      console.log(`Error al guardar archivo: ${error}`);
    }
  }
}

const productManager = new ProductManager("./products.json");

class CartManager {
  constructor(path) {
    this.path = path;
    this.carts = [];
    this.nextId = 1;
    this.load();
  }

  createCart() {
    const newCart = { id: this.nextId++, products: [] };
    this.carts.push(newCart);
    this.save();
    return newCart;
  }

  getCartById(id) {
    this.load();
    const cart = this.carts.find((c) => c.id === id);
    if (cart) {
      return cart;
    } else {
      console.log("Error: Carrito no encontrado");
      return null;
    }
  }

  addProductToCart(cartId, productId, quantity = 1) {
    const cart = this.getCartById(cartId);
    if (cart) {
      const product = { productId, quantity };
      const existingProductIndex = cart.products.findIndex((p) => p.productId === productId);
      if (existingProductIndex !== -1) {
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        cart.products.push(product);
      }
      this.save();
      console.log(`Producto con id ${productId} agregado al carrito ${cartId}`);
    }
  }

  load() {
    try {
      const data = fs.readFileSync(this.path);
      this.carts = JSON.parse(data);
      this.nextId = this.carts.length + 1;
    } catch (error) {
      console.log(`Error al cargar archivo: ${error}`);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.carts));
    } catch (error) {
      console.log(`Error al guardar archivo: ${error}`);
    }
  }
}

const cartManager = new CartManager("./carrito.json");


const productRouter = express.Router();


productRouter.get("/", (req, res) => {
  const products = productManager.getProducts();
  res.json(products);
});


productRouter.get("/:pid", (req, res) => {
  const { pid } = req.params;
  const product = productManager.getProductById(Number(pid));

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "Producto no encontrado" });
  }
});


productRouter.post("/", (req, res) => {
  const product = req.body;
  const newProduct = productManager.addProduct(product);
  res.json(newProduct);
});


productRouter.put("/:pid", (req, res) => {
  const { pid } = req.params;
  const product = req.body;
  productManager.updateProduct(Number(pid), product);
  res.json({ message: "Producto actualizado correctamente" });
});


productRouter.delete("/:pid", (req, res) => {
  const { pid } = req.params;
  productManager.deleteProduct(Number(pid));
  res.json({ message: "Producto eliminado correctamente" });
});


const cartRouter = express.Router();


cartRouter.post("/", (req, res) => {
  const newCart = cartManager.createCart();
  res.json(newCart);
});


cartRouter.get("/:cid", (req, res) => {
  const { cid } = req.params;
  const cart = cartManager.getCartById(Number(cid));

  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).json({ error: "Carrito no encontrado" });
  }
});


cartRouter.post("/:cid/product/:pid", (req, res) => {
  const { cid, pid } = req.params;
  const quantity = req.body.quantity || 1;
  cartManager.addProductToCart(Number(cid), Number(pid), quantity);
  res.json({ message: "Producto agregado al carrito correctamente" });
});


app.use("/api/products", productRouter);
app.use("/api/carts", cartRouter);

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

