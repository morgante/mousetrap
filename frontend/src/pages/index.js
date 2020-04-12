import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Mousetrap from "../components/mousetrap";

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />
    <h1>Hi people</h1>
    <Mousetrap />
  </Layout>
)

export default IndexPage
